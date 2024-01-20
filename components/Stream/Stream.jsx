import {
  Player,
  useCreateStream,
  useUpdateStream,
  Broadcast,
  useStreamSession,
} from '@livepeer/react';
import { useMemo, useState, useContext, useEffect, useRef } from 'react';
import { useDisclosure } from '@mantine/hooks';
import {
  updateProfile,
  getIsFollowing,
  updateFollowingStatus,
  submitPost,
  getSingleProfile,
} from 'deso-protocol';
import {
  Title,
  Input,
  Paper,
  Textarea,
  Group,
  Button,
  Space,
  Center,
  CopyButton,
  Tabs,
  Tooltip,
  Card,
  Badge,
  Loader,
  Text,
  Progress,
  Divider,
  Accordion,
  useMantineTheme,
  rem,
  Collapse,
  UnstyledButton,
  ActionIcon,
  PasswordInput,
  Switch,
  HoverCard,
  Overlay,
  Image,
} from '@mantine/core';
import { TwitchPlayer, TwitchChat } from 'react-twitch-embed';
import {
  IconCopy,
  IconRocket,
  IconCheck,
  IconScreenShare,
  IconAt,
  IconBrandYoutube,
  IconBrandTwitch,
  IconKey,
  IconUser,
  IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { RiYoutubeLine } from 'react-icons/ri';
import { BsTwitch } from 'react-icons/bs';
import { useInterval } from '@mantine/hooks';
import { DeSoIdentityContext } from 'react-deso-protocol';
import { RiKickLine } from 'react-icons/ri';
import { AiOutlineLink } from 'react-icons/ai';
import { GrLaunch } from 'react-icons/gr';
import { VscKey } from 'react-icons/vsc';
import { BiUserCircle } from 'react-icons/bi';
import { TiInfoLargeOutline } from 'react-icons/ti';
import classes from './Stream.module.css';
import { HowTo } from '@/components/HowTo/HowTo';

export const Stream = () => {
  const { currentUser } = useContext(DeSoIdentityContext);
  
  const [streamName, setStreamName] = useState('');
  const [isFollowingWaves, setisFollowingWaves] = useState(false);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [disable, { toggle }] = useDisclosure(false);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('first');
  const [openedMulti, { toggle: toggleMulti }] = useDisclosure(true);
  const embed = useRef(); // We use a ref instead of state to avoid rerenders.

  const handleReady = (e) => {
    embed.current = e;
  };

  const interval = useInterval(
    () =>
      setProgress((current) => {
        if (current < 100) {
          return current + 1;
        }

        interval.stop();
        setLoaded(true);
        return 0;
      }),
    20
  );

  // Allowing user to create streams via livepeers useCreateStream hook
  const {
    mutate: createStream,
    data: stream,
    status,
  } = useCreateStream(streamName ? { name: streamName } : null);

  const isLoading = useMemo(() => status === 'loading', [status]);

  const streamId = stream?.id;

  const showOverlay = !!stream;
  const { mutate: suspendStream } = useUpdateStream({
    streamId,
    suspend: true,
  });

  const handleEndStream = async () => {
    suspendStream?.();
    setStreamName('');
  };
  
  const { mutate: recordStream } = useUpdateStream({
    streamId,
    record: true,
  });

  const handleEnableRecording = async () => {
    recordStream?.();
  };
  const [isRecordingEnabled, setIsRecordingEnabled] = useState(false);

  const [twitchStreamKey, setTwitchStreamKey] = useState('');
  const [twitchUsername, setTwitchUsername] = useState('');
  const [twitchInput, setTwitchInput] = useState('');
  const {
    mutate: twitchMultistream,
    error,
    isSuccess,
    status: twitchStatus,
  } = useUpdateStream({
    streamId,
    multistream: {
      targets: [
        {
          profile: 'source',
          spec: {
            name: 'Twitch',
            url: `rtmp://live.twitch.tv/app/${twitchStreamKey}`, // Use the RTMP URL entered by the user
          },
        },
      ],
    },
  });

  const handleEnableTwitchMultistream = async () => {
    setTwitchUsername(twitchInput);
    twitchMultistream?.();
  };

  const [ytStreamKey, setYTStreamKey] = useState('');
  const [ytStreamURL, setYTStreamURL] = useState('');
  const { mutate: youtubeMultistream, status: ytmulti } = useUpdateStream({
    streamId,
    multistream: {
      targets: [
        {
          profile: 'source',
          spec: {
            name: 'Youtube',
            url: `${ytStreamURL}/${ytStreamKey}`, // Use the RTMP URL entered by the user
          },
        },
      ],
    },
  });

  const handleEnableYTMultistream = async () => {
    youtubeMultistream?.();
  };

  const [kickStreamKey, setKickStreamKey] = useState('');
  const [kickStreamURL, setKickStreamURL] = useState('');
  const { mutate: kickMultistream, error: kickmulti } = useUpdateStream({
    streamId,
    multistream: {
      targets: [
        {
          profile: 'source',
          spec: {
            name: 'Kick',
            url: `${kickStreamURL}/app/${kickStreamKey}`, // Use the RTMP URL entered by the user
          },
        },
      ],
    },
  });

  const handleEnableKickMultistream = async () => {
    kickMultistream?.();
  };


  // Checking to see if Waves_Streams Account Follows the Streamer
  useEffect(() => {
    const isFollowingPublicKey = async () => {
      try {
        const result = await getIsFollowing({
          PublicKeyBase58Check: currentUser?.PublicKeyBase58Check,
          IsFollowingPublicKeyBase58Check: 'BC1YLfjx3jKZeoShqr2r3QttepoYmvJGEs7vbYx1WYoNmNW9FY5VUu6',
        });

        setisFollowingWaves(result.IsFollowing);
      } catch (error) {
        console.log('Something went wrong:', error);
      }
    };

    isFollowingPublicKey();
  }, [currentUser]);

  
  const postStreamToDeso = async () => {
    try {
      setIsButtonDisabled(true);

      // Waves_Streams follows Streamers
      // Will be using the Waves_Streams Following Feed to display the livestreams on the Waves Feed
      // Lazy way of building a feed
      if (isFollowingWaves === false) {
        await updateFollowingStatus({
          MinFeeRateNanosPerKB: 1000,
          IsUnfollow: false,
          FollowedPublicKeyBase58Check: 'BC1YLfjx3jKZeoShqr2r3QttepoYmvJGEs7vbYx1WYoNmNW9FY5VUu6',
          FollowerPublicKeyBase58Check: currentUser.PublicKeyBase58Check,
        });
      }

      // Posts stream onchain making it accessible across all deso apps
      await submitPost({
        UpdaterPublicKeyBase58Check: currentUser.PublicKeyBase58Check,
        BodyObj: {
          Body: `${stream?.name}\nTo Subscribe and ensure the best viewing experience, visit: \nhttps://desowaves.vercel.app/wave/${currentUser.ProfileEntryResponse.Username}`,
          VideoURLs: [`https://lvpr.tv/?v=${stream?.playbackId}`],
          ImageURLs: [],
        },
        PostExtraData: {
          WavesStreamTitle: stream?.name,
        }
      });

      notifications.show({
        title: 'Success',
        icon: <IconCheck size="1.1rem" />,
        color: 'green',
        message: 'Your Wave has Launched to DeSo',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        icon: <IconX size="1.1rem" />,
        color: 'red',
        message: `Something Happened: ${error}`,
      });
      console.log('something happened: ' + error);
      setIsButtonDisabled(false);
    }
  };

  return (
    <Paper shadow="sm" p="lg" withBorder>
      <HowTo />
     
      <Space h="md" />
      <Tabs
        variant="pills"
        radius="md"
        value={activeTab}
        onTabChange={setActiveTab}
        isDisabled={showOverlay}
      >
        <Tabs.List justify="center">
          <Tabs.Tab value="first">Stream via OBS/StreamLabs</Tabs.Tab>
          <Tabs.Tab value="second">Stream via Webcam (Mobile Friendly)</Tabs.Tab>
        </Tabs.List>

        <Space h="md" />
        <Tabs.Panel value="first">
          {' '}
          <Space h="md" />
          <Center>
            <Text fz="lg" fw={777} c="dimmed" truncate>
              Start Streaming
            </Text>
          </Center>
          <Space h="md" />
          <Textarea
            placeholder="Enter Stream Title"
            variant="filled"
            radius="md"
            disabled={disable}
            onChange={(e) => setStreamName(e.target.value)}
          />
          <Space h="xl" />
          {status === 'success' && (
            <>
              {streamName ? (
                <>
                  <Card shadow="sm" p="lg" radius="md" withBorder>
                    <HoverCard width={280} closeDelay={700} shadow="md">
                      <HoverCard.Target>
                        <ActionIcon radius="xl" size="sm" variant="outline">
                          <TiInfoLargeOutline />
                        </ActionIcon>
                      </HoverCard.Target>
                      <HoverCard.Dropdown>
                        <Text fw={500} size="sm">
                          Copy & paste your Stream URL/Key into OBS Studio or Streamlabs to go Live.
                        </Text>
                        <Space h="xs" />
                        <Text fw={500} size="sm">
                          Once your stream is Active, Launch your Wave to your DeSo Account to bring
                          your broadcast to the blockchain!
                        </Text>
                      </HoverCard.Dropdown>
                    </HoverCard>

                    <Space h="md" />
                    <Group justify="center">
                      <Title order={1}>
                        <Text radius="sm" fw={700} fz="lg">
                          {streamName}
                        </Text>{' '}
                      </Title>
                    </Group>

                    <Divider my="sm" />

                    <Space h="md" />
                    <Group justify="center">
                      <CopyButton value={stream.streamKey} timeout={2000}>
                        {({ copied, copy }) => (
                          <Button fullWidth color={copied ? 'teal' : 'blue'} onClick={copy}>
                            {copied ? (
                              <>
                                <Center>
                                  <h4>Stream Key</h4>
                                  <Space w="xs" />
                                  <IconCheck size={16} />
                                </Center>
                              </>
                            ) : (
                              <>
                                <Center>
                                  <h4>Stream Key</h4>
                                  <Space w="xs" />
                                  <IconKey size={16} />
                                </Center>
                              </>
                            )}
                          </Button>
                        )}
                      </CopyButton>

                      <Button
                        rightSection={<IconRocket size="1rem" />}
                        fullWidth
                        className={classes.button}
                        onClick={() => {
                          postStreamToDeso();
                          
                        }}
                        color={'blue'}
                      >
                        Launch Wave
                      </Button>
                    </Group>
                    <Space h="md" />
                  </Card>
                  <Space h="md" />
                  <Group justify="center">
                    <Button
                      variant="gradient"
                      gradient={{ from: 'indigo', to: 'cyan' }}
                      fullWidth
                      radius="xl"
                      size="md"
                      onClick={toggleMulti}
                    >
                      {' '}
                      <Text align="center" fw={700} fz="lg">
                        Multistream
                      </Text>
                    </Button>
                  </Group>

                  <Collapse in={openedMulti}>
                    <Divider my="sm" />
                    <Paper shadow="md" radius="md" p="lg" withBorder>
                      <HoverCard width={280} closeDelay={700} shadow="md">
                        <HoverCard.Target>
                          <ActionIcon radius="xl" size="sm" variant="outline">
                            <TiInfoLargeOutline />
                          </ActionIcon>
                        </HoverCard.Target>
                        <HoverCard.Dropdown>
                          <Text fw={500} size="sm">
                            Broadcast your Stream to multiple platforms with Multistreaming!
                          </Text>
                          <Space h="xs" />
                          <Text fw={500} size="sm">
                            Just paste in the necessary information and click the Launch button.
                          </Text>
                          <Space h="xs" />
                          <Text fw={500} size="sm">
                            It is recommended to have separate tabs open of your Multistreams to
                            ensure everything is working!
                          </Text>
                          <Space h="xs" />
                          <Text fw={500} size="sm">
                            Be sure to set the Stream Title, Category, etc in the apps you are
                            multistreaming to.
                          </Text>
                        </HoverCard.Dropdown>
                      </HoverCard>
                      <Space h="xs" />
                      <Accordion variant="separated" radius="md" defaultValue="Youtube">
                        <Accordion.Item value="Youtube">
                          <Accordion.Control icon={<RiYoutubeLine size={'1.5rem'} color="red" />}>
                            <Text c="dimmed" fw={500}>
                              Youtube
                            </Text>
                          </Accordion.Control>
                          <Accordion.Panel>
                            <Input
                              icon={<BiUserCircle />}
                              placeholder="Enter Your Youtube Stream URL"
                              radius="md"
                              value={ytStreamURL}
                              onChange={(e) => setYTStreamURL(e.target.value)}
                            />
                            <Space h="md" />
                            <PasswordInput
                              icon={<AiOutlineLink />}
                              placeholder="Enter Your Youtube Stream Key"
                              radius="md"
                              value={ytStreamKey}
                              onChange={(e) => setYTStreamKey(e.target.value)}
                            />
                            <Space h="md" />
                            <Group justify="right">
                              <Button
                                rightSection={<IconRocket size="1rem" />}
                                variant="light"
                                size="xs"
                                onClick={handleEnableYTMultistream}
                              >
                                Launch
                              </Button>
                              {ytmulti && <div>{ytmulti.message}</div>}
                            </Group>
                          </Accordion.Panel>
                        </Accordion.Item>

                        <Accordion.Item value="Twitch">
                          <Accordion.Control icon={<BsTwitch size={'1.5rem'} color="purple" />}>
                            <Text c="dimmed" fw={500}>
                              Twitch
                            </Text>
                          </Accordion.Control>
                          <Accordion.Panel>
                            <Input
                              icon={<BiUserCircle />}
                              placeholder="Enter Your Twitch Username"
                              radius="md"
                              value={twitchInput}
                              onChange={(e) => setTwitchInput(e.target.value)}
                            />
                            <Space h="md" />
                            <PasswordInput
                              icon={<VscKey />}
                              placeholder="Enter Your Twitch Stream Key"
                              radius="md"
                              value={twitchStreamKey}
                              onChange={(e) => setTwitchStreamKey(e.target.value)}
                            />
                            <Space h="md" />
                            <Group justify="right">
                              <Button
                                rightSectioncon={<IconRocket size="1rem" />}
                                variant="light"
                                size="xs"
                                onClick={handleEnableTwitchMultistream}
                              >
                                Launch
                              </Button>
                              {error && <div>{error.message}</div>}
                            </Group>

                            {twitchUsername && (
                              <>
                                <Space h="md" />
                                <Center>
                                  <TwitchPlayer
                                    channel={twitchUsername}
                                    width={333}
                                    muted
                                    onReady={handleReady}
                                    id="1"
                                  />
                                  <Space w="md" />
                                  <TwitchChat channel={twitchUsername} darkMode />
                                </Center>
                              </>
                            )}
                          </Accordion.Panel>
                        </Accordion.Item>

                        <Accordion.Item value="Kick">
                          <Accordion.Control icon={<RiKickLine size={'1.5rem'} color="green" />}>
                            {' '}
                            <Text c="dimmed" fw={500}>
                              Kick
                            </Text>
                          </Accordion.Control>
                          <Accordion.Panel>
                            <Input
                              icon={<AiOutlineLink />}
                              placeholder="Enter Kick Stream URL"
                              radius="md"
                              value={kickStreamURL}
                              onChange={(e) => setKickStreamURL(e.target.value)}
                            />
                            <Space h="md" />
                            <PasswordInput
                              icon={<VscKey />}
                              placeholder="Enter Kick Stream Key"
                              radius="md"
                              value={kickStreamKey}
                              onChange={(e) => setKickStreamKey(e.target.value)}
                            />{' '}
                            <Space h="md" />
                            <Group justify="right">
                              <Button
                                onClick={handleEnableKickMultistream}
                                rightSectioncon={<IconRocket size="1rem" />}
                                variant="light"
                                size="xs"
                              >
                                Launch
                              </Button>
                            </Group>
                          </Accordion.Panel>
                        </Accordion.Item>
                      </Accordion>
                    </Paper>
                  </Collapse>

                  <Space h="md" />
                  <Group justify="center">
                    <Player 
                    priority 
                    controls={{ autohide: 0, hotkeys: false, defaultVolume: 0.6 }}
                    showPipButton
                    theme={{
                        colors: {
                          loading: '#3cdfff',
                        }
                      }}
                    title={stream?.name} playbackId={stream?.playbackId} muted />
                  </Group>

                  
                </>
              ) : (
                <Group justify="center">
                  <p>Wave suspended. Refresh to create a new Wave.</p>
                </Group>
              )}
            </>
          )}
          {status === 'loading' && (
            <Group justify="center">
              <Loader size="sm" />
            </Group>
          )}
          {status === 'error' && (
            <Group justify="center">
              <p>Error occurred while creating your wave.</p>
            </Group>
          )}
          <Space h="md" />
          {!stream && (
            <Group justify="center">
              <Button
                radius="xl"
                onClick={() => {
                  toggle();
                  createStream?.(); // Create the stream and store the result
                }}
                disabled={isLoading || !createStream}
              >
                Create Wave
              </Button>
            </Group>
          )}
          <Space h="md" />
          <Group>
            <CopyButton
              value={`https://desowaves.vercel.app/wave/${currentUser.ProfileEntryResponse.Username}`}
              timeout={2000}
            >
              {({ copied, copy }) => (
                <Button size="xs" color={copied ? 'teal' : 'blue'} onClick={copy}>
                  {copied ? (
                    <>
                      <Tooltip label="Copied Wave">
                        <IconCheck size={16} />
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip label="Share your Wave">
                        <IconScreenShare size={16} />
                      </Tooltip>
                    </>
                  )}
                </Button>
              )}
            </CopyButton>

            
          </Group>
        </Tabs.Panel>
        <Tabs.Panel value="second">
          {' '}
          <Space h="md" />
          <Center>
            <Text fz="lg" fw={777} c="dimmed" truncate>
              Start Streaming
            </Text>
          </Center>
          <Space h="md" />
          <Textarea
            placeholder="Enter Stream Title"
            variant="filled"
            radius="md"
            disabled={disable}
            onChange={(e) => setStreamName(e.target.value)}
          />
          <Space h="xl" />
          {status === 'success' && (
            <>
              {streamName ? (
                <>
                  <Center>
                    <Card shadow="sm" p="lg" radius="md" withBorder>
                      <HoverCard width={280} closeDelay={700} shadow="md">
                        <HoverCard.Target>
                          <ActionIcon radius="xl" size="sm" variant="outline">
                            <TiInfoLargeOutline />
                          </ActionIcon>
                        </HoverCard.Target>
                        <HoverCard.Dropdown>
                          <Text fw={500} size="sm">
                            You will be asked to allow Camera/Audio Access for you device.
                          </Text>
                          <Space h="xs" />
                          <Text fw={500} size="sm">
                            Now just Launch your Wave to DeSo!
                          </Text>
                        </HoverCard.Dropdown>
                      </HoverCard>
                      <Space h="xs" />
                      <Group justify="center">
                        <Title order={1}>
                          <Text radius="sm" fw={700} fz="lg">
                            {streamName}
                          </Text>{' '}
                        </Title>
                      </Group>

                      <Divider my="sm" />

                      <Group justify="center">
                        <Button
                          fullWidth
                          className={classes.button}
                          onClick={() => {
                            attachStreamToDesoProfile();
                            loaded ? setLoaded(false) : !interval.active && interval.start();
                          }}
                          color={'blue'}
                        >
                          Launch Wave
                        </Button>
                      </Group>
                      <Space h="md" />
                    </Card>
                    <Space h="xl" />
                  </Center>
                  <Space h="md" />
                  <Group justify="center">
                    <Broadcast title={stream?.name} streamKey={stream.streamKey} muted />
                  </Group>

                 
                </>
              ) : (
                <Group justify="center">
                  <p>Wave suspended. Refresh to create a new Wave.</p>
                </Group>
              )}
            </>
          )}
          {status === 'loading' && (
            <Group justify="center">
              <Loader size="sm" />
            </Group>
          )}
          {status === 'error' && (
            <Group justify="center">
              <p>Error occurred while creating your wave.</p>
            </Group>
          )}
          <Space h="md" />
          {!stream && (
            <Group justify="center">
              <Button
                radius="xl"
                onClick={() => {
                  toggle();

                  createStream?.(); // Create the stream and store the result
                }}
                disabled={isLoading || !createStream}
              >
                Create Wave
              </Button>
            </Group>
          )}
          <Space h="md" />
          <Group>
            <CopyButton
              value={`https://desowaves.vercel.app.app/wave/${currentUser.ProfileEntryResponse.Username}`}
              timeout={2000}
            >
              {({ copied, copy }) => (
                <Button size="xs" color={copied ? 'teal' : 'blue'} onClick={copy}>
                  {copied ? (
                    <>
                      <Tooltip label="Copied Wave">
                        <IconCheck size={16} />
                      </Tooltip>
                    </>
                  ) : (
                    <>
                      <Tooltip label="Share your Wave">
                        <IconScreenShare size={16} />
                      </Tooltip>
                    </>
                  )}
                </Button>
              )}
            </CopyButton>

          </Group>
        </Tabs.Panel>
      </Tabs>
    </Paper>
  );
};
